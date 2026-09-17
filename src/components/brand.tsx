import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Pixlwave home">
      <svg viewBox="0 0 56 28" role="img" aria-hidden="true">
        <path d="M2 18C10 3 19 3 29 14c7 8 14 8 25-5-2 13-9 18-18 17-7-1-11-8-17-8-5 0-10 3-17 0Z" fill="currentColor" />
        <path d="M2 18C10 3 19 3 29 14c2 2 4 4 6 5-6 2-10-1-15-5C14 9 9 13 2 18Z" fill="#146CEB" />
      </svg>
      <span>pixlwave</span>
    </Link>
  );
}
