const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        getFiles(name, files);
      }
    } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Replace Link
  if (content.includes('import Link from "next/link"') || content.includes("import Link from 'next/link'")) {
    content = content.replace(/import Link from ["']next\/link["']/g, 'import { Link } from "@/i18n/routing"');
    updated = true;
  }

  // Replace useRouter and usePathname from next/navigation
  if (content.includes('from "next/navigation"') || content.includes("from 'next/navigation'")) {
    // Only replace if it contains useRouter or usePathname
    if (content.includes('useRouter') || content.includes('usePathname')) {
      // If it only has useRouter/usePathname, replace the whole import line
      // This is a bit tricky if there are other things like useSearchParams
      
      // Simple cases first
      content = content.replace(/import \{ useRouter \} from ["']next\/navigation["']/g, 'import { useRouter } from "@/i18n/routing"');
      content = content.replace(/import \{ usePathname \} from ["']next\/navigation["']/g, 'import { usePathname } from "@/i18n/routing"');
      content = content.replace(/import \{ usePathname, useRouter \} from ["']next\/navigation["']/g, 'import { usePathname, useRouter } from "@/i18n/routing"');
      content = content.replace(/import \{ useRouter, usePathname \} from ["']next\/navigation["']/g, 'import { useRouter, usePathname } from "@/i18n/routing"');

      // Complex cases (like useSearchParams, useRouter)
      if (content.includes('useRouter') || content.includes('usePathname')) {
         // We might need to split imports if they mix routing and non-routing hooks
         // But for now, let's see if we can do more specific replacements
         content = content.replace(/import \{ useSearchParams, useRouter \} from ["']next\/navigation["']/g, 'import { useSearchParams } from "next/navigation";\nimport { useRouter } from "@/i18n/routing"');
         content = content.replace(/import \{ useRouter, useSearchParams \} from ["']next\/navigation["']/g, 'import { useSearchParams } from "next/navigation";\nimport { useRouter } from "@/i18n/routing"');
      }

      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
