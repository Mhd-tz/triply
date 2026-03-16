import Image from "next/image";
import Logo from "@/src/assets/images/logo.png"

export default function Home() {
  return (
    <div>
      <Image
        src={Logo}
        alt="Logo"
        width={100}
        height={100}
      />
    </div>
  );
}
