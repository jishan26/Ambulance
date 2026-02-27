import React from "react";
import { Twitter, Instagram, Linkedin } from "react-icons/fa";
import { Phone, MapPin, Mail } from "react-icons/fi";
function Footer() {
  return (
    <div>
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">Rapid Rescue</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Revolutionizing emergency medical transport with innovative
                technology and compassionate care.
              </p>
              <div className="flex space-x-4">
                {/* <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" /> */}
                {/* <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" /> */}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Emergency Transport
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Medical Equipment
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Critical Care
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Ambulance Tracking
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press Kit
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Partners
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Legal</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="bg-gradient-emergency rounded-2xl p-6 text-center">
              <h3 className="text-xl font-bold mb-2">24/7 Emergency Hotline</h3>
              <div className="flex items-center justify-center space-x-2 text-lg font-semibold mb-4">
                {/* <Phone className="w-5 h-5" /> */}
                <span>(555) 911-LIFE</span>
              </div>
              <p className="text-sm text-white/90">
                Available round the clock for emergency medical transport
                services
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 Rapid Rescue Emergency Services. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                {/* <MapPin className="w-4 h-4" /> */}
                <span>Licensed in all 50 states</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                {/* <Mail className="w-4 h-4" /> */}
                <span>info@Rapid Rescue.com</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
