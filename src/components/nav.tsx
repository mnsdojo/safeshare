import { Github, Shield } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";

function Nav() {
  return (
    <header className="container mx-auto px-4 py-6">
      <div className=" flex justify-between items-center ">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold hover:text-primary transition-colors"
        >
          <span>SafeShare</span>
          <Shield className="h-5 w-5 text-green-500" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com" target="_blank">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Nav;
