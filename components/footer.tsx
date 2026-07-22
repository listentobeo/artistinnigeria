import Link from "next/link";
import { artistCategories, categoryHubUrl } from "@/lib/categories";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner footer-expanded">
        <div><Link className="brand brand-light" href="/">Artist<span>in</span>Nigeria<i>.</i></Link><p>Find local artists and creative services across Nigeria.</p></div>
        <div className="footer-category-links">{artistCategories.map((category) => <Link href={categoryHubUrl(category)} key={category.slug}>{category.displayName}</Link>)}</div>
        <div className="footer-links"><Link href="/find-artists">Find artists</Link><Link href="/apply">Join the directory</Link></div>
        <p className="copyright">© {new Date().getFullYear()} Artist in Nigeria</p>
      </div>
    </footer>
  );
}
