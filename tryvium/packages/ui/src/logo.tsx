import Link from 'next/link'
import Image from 'next/image'

export function Logo({ className, width = 140, height = 38 }: { className?: string; width?: number; height?: number }) {
  return (
    <Link href="/" className={className}>
      <Image
        src="https://www.tryvium.ai/wp-content/uploads/2026/05/tryvium-logo.svg"
        alt="Tryvium"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </Link>
  )
}
