import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const PINATA_API_KEY = process.env.PINATA_API_KEY;
        const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

        console.log('[Upload Image] PINATA_KEYS exist:', !!PINATA_API_KEY && !!PINATA_API_SECRET);

        if (!PINATA_API_KEY || !PINATA_API_SECRET) {
            return NextResponse.json(
                { success: false, error: 'Pinata configuration missing. Please check .env file' },
                { status: 500 }
            );
        }

        const headers = {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_API_SECRET
        };

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const imageUrl = formData.get('imageUrl') as string | null;

        // Case 1: File upload
        if (file) {
            const pinataFormData = new FormData();
            pinataFormData.append('file', file);
            pinataFormData.append('pinataMetadata', JSON.stringify({
                name: file.name || 'nft-image'
            }));

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: headers,
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

        // Case 2: Image URL (use as-is)
        if (imageUrl) {
            return NextResponse.json({
                success: true,
                imageUri: imageUrl,
                imageCid: null
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
