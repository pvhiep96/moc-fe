import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'About MOC Productions';
export const size = {
  width: 1200,
  height: 630,
};
 
export const contentType = 'image/png';
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: 'black' }}>
            MOC Productions
          </div>
          <div style={{ fontSize: '36px', color: '#666', marginTop: '20px' }}>
            About Us
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
