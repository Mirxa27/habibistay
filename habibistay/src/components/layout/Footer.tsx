import Link from 'next/link';

// Placeholder icon components since we're having issues with react-icons
const IconComponent = ({ size = 20, children }: { size?: number, children: React.ReactNode }) => (
  <span className="inline-block" style={{ width: `${size}px`, height: `${size}px` }}>{children}</span>
);

const FaFacebook = ({ size }: { size?: number }) => <IconComponent size={size}>📘</IconComponent>;
const FaTwitter = ({ size }: { size?: number }) => <IconComponent size={size}>🐦</IconComponent>;
const FaInstagram = ({ size }: { size?: number }) => <IconComponent size={size}>📷</IconComponent>;
const FaLinkedin = ({ size }: { size?: number }) => <IconComponent size={size}>💼</IconComponent>;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Habibistay</h3>
            <p className="text-gray-300 text-sm">
              Find and book unique accommodations around the world. Experience the comfort of home
              wherever you go.
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <FaFacebook size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <FaLinkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Discover</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href={"/search" as any} className="hover:text-white">
                  Search Properties
                </Link>
              </li>
              <li>
                <Link href={"/cities" as any} className="hover:text-white">
                  Cities
                </Link>
              </li>
              <li>
                <Link href={"/categories" as any} className="hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link href={"/experiences" as any} className="hover:text-white">
                  Experiences
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Hosting</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href={"/host" as any} className="hover:text-white">
                  Become a Host
                </Link>
              </li>
              <li>
                <Link href={"/host/resources" as any} className="hover:text-white">
                  Resources
                </Link>
              </li>
              <li>
                <Link href={"/host/community" as any} className="hover:text-white">
                  Community
                </Link>
              </li>
              <li>
                <Link href={"/host/responsible-hosting" as any} className="hover:text-white">
                  Responsible Hosting
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href={"/help" as any} className="hover:text-white">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href={"/contact" as any} className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href={"/cancellation-options" as any} className="hover:text-white">
                  Cancellation Options
                </Link>
              </li>
              <li>
                <Link href={"/safety" as any} className="hover:text-white">
                  Safety Information
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm">
            &copy; {currentYear} Habibistay. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4 text-sm text-gray-300">
            <Link href={"/terms" as any} className="hover:text-white">
              Terms of Service
            </Link>
            <Link href={"/privacy" as any} className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href={"/cookies" as any} className="hover:text-white">
              Cookie Policy
            </Link>
            <Link href={"/sitemap" as any} className="hover:text-white">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
