import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const PINATA_API_KEY = process.env.PINATA_API_KEY;
    const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        return NextResponse.json({ error: 'Server configuration error: Missing Pinata API Keys' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;
        const name = formData.get('name') as string || '';
        const description = formData.get('description') as string || '';

        if (!imageFile) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        const headers = {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_API_SECRET
        };

        // 1. Upload Image to Pinata
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('pinataMetadata', JSON.stringify({ name: `image-${Date.now()}` }));

        const imageRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: headers,
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
                ...headers,
                'Content-Type': 'application/json'
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
                image: toGateway(imageCid)
            }
        });

    } catch (error: any) {
        console.error('Metadata generation error:', error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
