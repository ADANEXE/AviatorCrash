
import { useParams } from "wouter";

const policies = {
  terms: {
    title: "Terms of Service",
    content: `[Your terms of service content]`
  },
  privacy: {
    title: "Privacy Policy",
    content: `[Your privacy policy content]`
  },
  responsible: {
    title: "Responsible Gaming Policy",
    content: `[Your responsible gaming policy content]`
  }
};

export default function PolicyPage() {
  const { type } = useParams();
  const policy = type ? policies[type as keyof typeof policies] : null;

  if (!policy) {
    return <div>Policy not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{policy.title}</h1>
      <div className="prose prose-invert max-w-none">
        {policy.content}
      </div>
    </div>
  );
}
