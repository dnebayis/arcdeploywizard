import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const PINATA_JWT = process.env.PINATA_JWT;

        console.log('[Upload Image] PINATA_JWT exists:', !!PINATA_JWT);
        console.log('[Upload Image] PINATA_JWT length:', PINATA_JWT?.length || 0);

        if (!PINATA_JWT) {
            return NextResponse.json(
                { success: false, error: 'Pinata configuration missing. Please add PINATA_JWT to .env file' },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const imageUrl = formData.get('imageUrl') as string | null;

        // Case 1: File upload
        if (file) {
            const pinataFormData = new FormData();
            pinataFormData.append('file', file);

            const metadata = JSON.stringify({
                name: file.name || 'nft-image'
            });
            pinataFormData.append('pinataMetadata', metadata);

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`
                },
                body: pinataFormData
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[Pinata] Image upload failed:', error);
                throw new Error('Failed to upload image to IPFS');
            }

            const result = await response.json();

            return NextResponse.json({
                success: true,
                imageCid: result.IpfsHash,
                imageUri: `ipfs://${result.IpfsHash}`
            });
        }

        // Case 2: Image URL (use as-is or re-upload)
        if (imageUrl) {
            // For now, use URL as-is (can be extended to fetch and re-upload)
            return NextResponse.json({
                success: true,
                imageUri: imageUrl,
                imageCid: null // Not uploaded to IPFS
            });
        }

        return NextResponse.json(
            { success: false, error: 'No file or imageUrl provided' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[Pinata] Image upload error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Image upload failed' },
            { status: 500 }
        );
    }
}
