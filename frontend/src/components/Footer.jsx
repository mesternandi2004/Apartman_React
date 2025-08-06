// frontend/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold">ApartmanRental</span>
            </div>
            <p className="mt-4 text-gray-400">
              Prémium apartmanok kiadása Magyarországon. 
              Találja meg a tökéletes szállást következő utazásához.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Gyors linkek
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-base text-gray-300 hover:text-white">
                  Főoldal
                </Link>
              </li>
              <li>
                <Link to="/apartmanok" className="text-base text-gray-300 hover:text-white">
                  Apartmanok
                </Link>
              </li>
              <li>
                <Link to="/sign-up" className="text-base text-gray-300 hover:text-white">
                  Regisztráció
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Jogi információk
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Adatvédelem
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Felhasználási feltételek
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  ÁSZF
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Kapcsolat
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-base text-gray-300">info@apartman.hu</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-base text-gray-300">+36 30 123 4567</span>
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-base text-gray-300">Budapest, Magyarország</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; 2024 ApartmanRental. Minden jog fenntartva.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
