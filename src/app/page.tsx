import Image from "next/image";
import Logo from "@/src/assets/images/logo.png"
import { Button } from "@/src/components/ui/button";

export default function Home() {
  return (
    <div>
      <Image
        src={Logo}
        alt="Logo"
        width={100}
        height={100}
      />
      <Button>Button</Button>
    </div>
  );
}
