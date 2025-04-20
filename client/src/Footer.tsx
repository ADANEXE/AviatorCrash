import Link from 'next/link'; // Assuming Next.js is used for routing

function Footer() {
  return (
    <footer className="bg-gray-800 py-8">
      <div className="container mx-auto text-center">
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <Link href="/policy/terms">
            <a className="text-[#8A96A3] hover:text-white transition duration-200">
              Terms of Service
            </a>
          </Link>
          <Link href="/policy/privacy">
            <a className="text-[#8A96A3] hover:text-white transition duration-200">
              Privacy Policy
            </a>
          </Link>
          <Link href="/policy/responsible">
            <a className="text-[#8A96A3] hover:text-white transition duration-200">
              Responsible Gaming
            </a>
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;


// Placeholder policy pages.  These would need to be fleshed out with actual content.
export function TermsOfService() {
    return (
      <div>
        <h1>Terms of Service</h1>
        <p>This is a placeholder for the Terms of Service page.</p>
      </div>
    );
  }

export function PrivacyPolicy() {
    return (
      <div>
        <h1>Privacy Policy</h1>
        <p>This is a placeholder for the Privacy Policy page.</p>
      </div>
    );
  }

export function ResponsibleGaming() {
    return (
      <div>
        <h1>Responsible Gaming</h1>
        <p>This is a placeholder for the Responsible Gaming page.</p>
      </div>
    );
  }

  //Example Next.js page structure to show how to use these components. Requires appropriate next.config.js setup.
  export default function Policy({params}){
    if(params.policy === 'terms'){
      return <TermsOfService/>
    } else if (params.policy === 'privacy'){
      return <PrivacyPolicy/>
    } else if (params.policy === 'responsible'){
      return <ResponsibleGaming/>
    } else {
      return <p>Policy not found</p>
    }
  }

  export function getServerSideProps({params}) {
    return {props: {params}};
  }