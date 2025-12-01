import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ZIP-STEMS] Processing request...');

    const { stems, projectName } = await req.json();

    if (!stems || !Array.isArray(stems) || stems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No stem URLs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ZIP-STEMS] Downloading', stems.length, 'stems...');

    // Download all stems
    const stemData: Array<{ name: string; data: Uint8Array }> = [];
    
    for (const stem of stems) {
      try {
        const response = await fetch(stem.url);
        if (!response.ok) continue;
        
        const arrayBuffer = await response.arrayBuffer();
        stemData.push({
          name: stem.name || `stem-${stemData.length + 1}.wav`,
          data: new Uint8Array(arrayBuffer)
        });
        
        console.log(`[ZIP-STEMS] Downloaded: ${stem.name}`);
      } catch (error) {
        console.error(`[ZIP-STEMS] Failed to download ${stem.name}:`, error);
      }
    }

    if (stemData.length === 0) {
      throw new Error('Failed to download any stems');
    }

    console.log('[ZIP-STEMS] Creating ZIP archive...');

    // Create simple ZIP structure (without compression for simplicity)
    const zipBuffer = createSimpleZip(stemData);

    // Convert to base64 for JSON response
    let base64 = '';
    for (let i = 0; i < zipBuffer.length; i++) {
      base64 += String.fromCharCode(zipBuffer[i]);
    }
    const base64Zip = btoa(base64);

    return new Response(
      JSON.stringify({ 
        zipData: base64Zip,
        filename: `${projectName || 'stems'}-export.zip`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('[ZIP-STEMS] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Zip creation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simple ZIP file creator (store method, no compression)
function createSimpleZip(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const centralDir: Uint8Array[] = [];

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const fileData = file.data;
    
    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    
    view.setUint32(0, 0x04034b50, true); // signature
    view.setUint16(4, 20, true); // version
    view.setUint16(6, 0, true); // flags
    view.setUint16(8, 0, true); // compression (store)
    view.setUint16(10, 0, true); // time
    view.setUint16(12, 0, true); // date
    view.setUint32(14, crc32(fileData), true); // crc32
    view.setUint32(18, fileData.length, true); // compressed size
    view.setUint32(22, fileData.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true); // name length
    view.setUint16(28, 0, true); // extra length
    
    localHeader.set(nameBytes, 30);
    
    chunks.push(localHeader);
    chunks.push(fileData);
    
    // Central directory entry
    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(centralEntry.buffer);
    
    cdView.setUint32(0, 0x02014b50, true); // signature
    cdView.setUint16(4, 20, true); // version made by
    cdView.setUint16(6, 20, true); // version needed
    cdView.setUint16(8, 0, true); // flags
    cdView.setUint16(10, 0, true); // compression
    cdView.setUint16(12, 0, true); // time
    cdView.setUint16(14, 0, true); // date
    cdView.setUint32(16, crc32(fileData), true); // crc32
    cdView.setUint32(20, fileData.length, true); // compressed size
    cdView.setUint32(24, fileData.length, true); // uncompressed size
    cdView.setUint16(28, nameBytes.length, true); // name length
    cdView.setUint16(30, 0, true); // extra length
    cdView.setUint16(32, 0, true); // comment length
    cdView.setUint16(34, 0, true); // disk number
    cdView.setUint16(36, 0, true); // internal attributes
    cdView.setUint32(38, 0, true); // external attributes
    cdView.setUint32(42, offset, true); // local header offset
    
    centralEntry.set(nameBytes, 46);
    centralDir.push(centralEntry);
    
    offset += localHeader.length + fileData.length;
  });

  // End of central directory
  const cdStart = offset;
  const cdSize = centralDir.reduce((sum, entry) => sum + entry.length, 0);
  
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  
  eocdView.setUint32(0, 0x06054b50, true); // signature
  eocdView.setUint16(4, 0, true); // disk number
  eocdView.setUint16(6, 0, true); // cd start disk
  eocdView.setUint16(8, files.length, true); // cd entries on disk
  eocdView.setUint16(10, files.length, true); // total cd entries
  eocdView.setUint32(12, cdSize, true); // cd size
  eocdView.setUint32(16, cdStart, true); // cd offset
  eocdView.setUint16(20, 0, true); // comment length

  // Combine all chunks
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) + cdSize + eocd.length;
  const result = new Uint8Array(totalSize);
  let pos = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  
  for (const entry of centralDir) {
    result.set(entry, pos);
    pos += entry.length;
  }
  
  result.set(eocd, pos);
  
  return result;
}

// Simple CRC32 implementation
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ~crc >>> 0;
}
