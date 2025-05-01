import Link from 'next/link';
import Image from 'next/image';

interface DynamicLogoProps {
  width?: number;
  height?: number;
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({
  width = 120,
  height = 40
}) => {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 md:top-6 md:left-6 z-[10]"
    >
      <div className="logo-container">
        <Image
          src="/moc_nguyen_production_black.png"
          alt="MOC Productions Logo"
          width={width}
          height={height}
          className="h-auto w-[100px] md:w-[120px] object-contain"
          priority
        />
      </div>

      <style jsx>{`
        .logo-container {
          mix-blend-mode: difference;
          filter: invert(1);
          transition: transform 0.3s ease;
          position: relative;
          z-index: 9999;
        }

        .logo-container:hover {
          transform: scale(1.05);
        }
      `}</style>
    </Link>
  );
};

export default DynamicLogo;
