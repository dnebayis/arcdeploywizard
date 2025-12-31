import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { contractAddress, args } = body;

        if (!contractAddress || !args) {
            return NextResponse.json({ success: false, error: 'Missing address or args' }, { status: 400 });
        }

        // Create a temporary arguments file in /tmp (writable in Vercel/Lambda)
        const argsFilename = `arguments-${contractAddress}.js`;
        const argsPath = path.join(os.tmpdir(), argsFilename);

        const fileContent = `module.exports = ${JSON.stringify(args)};`;

        await fs.promises.writeFile(argsPath, fileContent);

        console.log(`Verifying ${contractAddress} with args in ${argsPath}...`);

        let lastError: any = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${MAX_RETRIES}: Running hardhat verify...`);

                const { stdout, stderr } = await execAsync(
                    `npx hardhat verify --network arcTestnet --constructor-args "${argsPath}" ${contractAddress}`
                );

                console.log('Verification output:', stdout);
                if (stderr) console.error('Verification stderr:', stderr);

                // Success! Cleanup and return
                await fs.promises.unlink(argsPath).catch(() => { });
                return NextResponse.json({ success: true, output: stdout });

            } catch (execError: any) {
                lastError = execError;
                console.warn(`Verification attempt ${attempt} failed:`, execError.message);

                // Check if we should retry
                // Messages like "no bytecode", "not found", "bad gateway" suggest transient indexing/network issues
                const msg = execError.message || execError.toString();
                const stdout = execError.stdout || '';

                // If already verified, return success immediately
                if (msg.includes("Already Verified") || stdout.includes("Already Verified")) {
                    await fs.promises.unlink(argsPath).catch(() => { });
                    return NextResponse.json({ success: true, output: "Contract source code already verified" });
                }

                const isIndexingIssue = msg.includes("no bytecode") ||
                    msg.includes("bytecode does not match") ||
                    msg.includes("contract not found") ||
                    stdout.includes("no bytecode");

                if (isIndexingIssue && attempt < MAX_RETRIES) {
                    console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    continue;
                }

                // If it's another error or we ran out of retries, break loop to handle failure
                if (!isIndexingIssue) break;
            }
        }

        // Cleanup
        await fs.promises.unlink(argsPath).catch(() => { });

        // If we got here, all attempts failed
        const msg = lastError?.message || lastError?.toString() || "Unknown error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
