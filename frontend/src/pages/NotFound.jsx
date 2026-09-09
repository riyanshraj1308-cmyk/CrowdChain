import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <span className="font-display text-6xl text-ink-950">404</span>
      <h1 className="mt-4 text-2xl text-ink-950">This page wandered off-chain.</h1>
      <p className="mt-2 max-w-sm text-ink-600">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button as={Link} to="/" icon={Compass} className="mt-8">
        Back to home
      </Button>
    </div>
  );
}
