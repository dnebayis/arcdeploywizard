import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const PINATA_JWT = process.env.PINATA_JWT;

    if (!PINATA_JWT) {
        return NextResponse.json({ error: 'Server configuration error: Missing PINATA_JWT' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;
        const name = formData.get('name') as string || '';
        const description = formData.get('description') as string || '';

        if (!imageFile) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        // 1. Upload Image to Pinata
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('pinataMetadata', JSON.stringify({ name: `image-${Date.now()}` }));

        const imageRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`
            },
            body: imageFormData
        });

        if (!imageRes.ok) {
            throw new Error(`Image upload failed: ${await imageRes.text()}`);
        }

        const imageData = await imageRes.json();
        const imageCid = imageData.IpfsHash;
        const imageUri = `ipfs://${imageCid}`;

        // 2. Upload Metadata JSON to Pinata
        const metadata = {
            name,
            description,
            image: imageUri
        };

        const metadataRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PINATA_JWT}`
            },
            body: JSON.stringify({
                pinataContent: metadata,
                pinataMetadata: { name: `metadata-${Date.now()}.json` }
            })
        });

        if (!metadataRes.ok) {
            throw new Error(`Metadata upload failed: ${await metadataRes.text()}`);
        }

        const metadataResult = await metadataRes.json();
        const metadataCid = metadataResult.IpfsHash;
        const metadataUri = `ipfs://${metadataCid}`;

        // Helper to convert to gateway for immediate frontend preview
        const toGateway = (cid: string) => `https://gateway.pinata.cloud/ipfs/${cid}`;

        return NextResponse.json({
            success: true,
            uri: metadataUri,
            imageUrl: toGateway(imageCid),
            metadata: {
                name,
                description,
                image: toGateway(imageCid) // Return gateway URL for preview convenience
            }
        });

    } catch (error: any) {
        console.error('Metadata generation error:', error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
