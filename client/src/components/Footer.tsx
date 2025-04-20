import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#0F1923] mt-8 py-4 border-t border-[#8A96A3]/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[#FF6B00]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 15C21 16.8565 19.1046 18 17 18H6.5C4.567 18 3 16.433 3 14.5C3 12.7571 4.30455 11.2957 6 11.035C6 11.035 6.03958 7 10 7C13.9604 7 14 11.035 14 11.035C15.6954 11.2957 17 12.7571 17 14.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 14.5C17 14.5 17.5 12.5 20 12.5C21.5 12.5 22.5 13.5 22.5 15C22.5 16.5 21.5 17.5 20 17.5C18.5 17.5 17 16.5 17 14.5Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h1 className="text-xl font-bold text-white">Aviator</h1>
            </div>
            <p className="text-[#8A96A3] text-sm mt-1">
              © 2023 Aviator Game. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6 flex-wrap justify-center">
            <Link href="#">
              <a className="text-[#8A96A3] hover:text-white transition duration-200">
                Terms of Service
              </a>
            </Link>
            <Link href="https://aviatocrash.blogspot.com/p/terms-of-services.html">
              <a className="text-[#8A96A3] hover:text-white transition duration-200">
                Privacy Policy
              </a>
            </Link>
            <Link href="https://aviatocrash.blogspot.com/p/privacy-policy.html">
              <a className="text-[#8A96A3] hover:text-white transition duration-200">
                Responsible Gaming
              </a>
            </Link>
            <Link href="https://aviatocrash.blogspot.com/p/responsible-gaming-policy.html">
              <a className="text-[#8A96A3] hover:text-white transition duration-200">
                Contact Us
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
