import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

const MAX_RETRIES = 3;
const RETRY_DELAY = 8000; // 8 seconds - give blockchain explorers time to index

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { contractAddress, constructorArgs } = body;

        if (!contractAddress || !constructorArgs) {
            return NextResponse.json(
                { success: false, error: 'Missing contract address or constructor arguments' },
                { status: 400 }
            );
        }

        console.log(`[Verification] Starting verification for ${contractAddress}`);

        // Create temporary arguments file in /tmp (writable in serverless environments)
        const argsFilename = `arguments-${contractAddress.toLowerCase()}.js`;
        const argsPath = path.join(os.tmpdir(), argsFilename);

        // Ensure constructor args are properly formatted
        const formattedArgs = constructorArgs.map((arg: any) => {
            // Convert BigInt to string for JSON serialization
            if (typeof arg === 'bigint') return arg.toString();
            // Keep strings and numbers as-is
            return arg;
        });

        const fileContent = `module.exports = ${JSON.stringify(formattedArgs, null, 2)};`;
        await fs.promises.writeFile(argsPath, fileContent);

        console.log(`[Verification] Arguments file created at ${argsPath}`);
        console.log(`[Verification] Constructor args:`, formattedArgs);

        let lastError: any = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[Verification] Attempt ${attempt}/${MAX_RETRIES}`);

                // Use absolute path to hardhat to avoid PATH issues in serverless
                const { stdout, stderr } = await execAsync(
                    `npx hardhat verify --network arcTestnet --constructor-args "${argsPath}" ${contractAddress}`,
                    {
                        cwd: process.cwd(),
                        env: {
                            ...process.env,
                            // Set writable directories for serverless
                            HOME: os.tmpdir(),
                            npm_config_cache: path.join(os.tmpdir(), 'npm-cache')
                        }
                    }
                );

                console.log('[Verification] Success:', stdout);
                if (stderr) console.warn('[Verification] Warnings:', stderr);

                // Cleanup
                await fs.promises.unlink(argsPath).catch(() => { });

                return NextResponse.json({
                    success: true,
                    message: 'Contract verified successfully',
                    output: stdout
                });

            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || error.toString();
                const stdout = error.stdout || '';
                const stderr = error.stderr || '';

                console.error(`[Verification] Attempt ${attempt} failed:`, errorMessage);
                console.error('[Verification] stdout:', stdout);
                console.error('[Verification] stderr:', stderr);

                // Check if already verified
                if (
                    errorMessage.includes('Already Verified') ||
                    stdout.includes('Already Verified') ||
                    errorMessage.includes('already verified')
                ) {
                    await fs.promises.unlink(argsPath).catch(() => { });
                    return NextResponse.json({
                        success: true,
                        message: 'Contract source code already verified'
                    });
                }

                // Check if it's an indexing issue (contract not yet indexed by explorer)
                const isIndexingIssue =
                    errorMessage.includes('not found') ||
                    errorMessage.includes('no bytecode') ||
                    errorMessage.includes('bytecode does not match') ||
                    stderr.includes('not found');

                if (isIndexingIssue && attempt < MAX_RETRIES) {
                    console.log(`[Verification] Indexing issue detected. Waiting ${RETRY_DELAY}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    continue; // Retry
                }

                // If it's not an indexing issue, don't retry
                if (!isIndexingIssue) {
                    break;
                }
            }
        }

        // Cleanup
        await fs.promises.unlink(argsPath).catch(() => { });

        // All retries failed
        const errorMsg = lastError?.message || lastError?.toString() || 'Unknown verification error';
        console.error('[Verification] All attempts failed:', errorMsg);

        return NextResponse.json(
            {
                success: false,
                error: `Verification failed: ${errorMsg}`,
                details: lastError?.stdout || lastError?.stderr || ''
            },
            { status: 500 }
        );

    } catch (error: any) {
        console.error('[Verification] API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
