'use client';

import ResponsiveImage from '../../components/ui/ResponsiveImage';

export default function TestResponsiveImage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Responsive Image Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Landscape Image</h2>
          <div className="border rounded-lg overflow-hidden">
            <ResponsiveImage
              publicId="sample"
              alt="Beautiful landscape"
              width={1200}
              height={800}
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={80}
              crop="fill"
              gravity="auto"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Portrait Image with Blur</h2>
          <div className="border rounded-lg overflow-hidden">
            <ResponsiveImage
              publicId="sample-portrait"
              alt="Portrait with blur placeholder"
              width={800}
              height={1200}
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={80}
              crop="fill"
              gravity="face"
              withPlaceholder={true}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Wide Banner</h2>
        <div className="border rounded-lg overflow-hidden">
          <ResponsiveImage
            publicId="banner"
            alt="Wide banner image"
            width={1920}
            height={400}
            className="w-full h-auto"
            sizes="100vw"
            quality={85}
            crop="fill"
            effect="sharpen"
          />
        </div>
      </div>
    </div>
  );
}
