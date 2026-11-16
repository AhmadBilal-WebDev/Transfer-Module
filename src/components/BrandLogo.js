import Image from 'next/image'

const MAIN_LOGO = '/updatedImages/Main-Logo.png'

/** Site-wide Royalane brand mark */
export default function BrandLogo({
  className,
  width = 168,
  height = 40,
  priority = false,
  alt = 'Royalane',
}) {
  return (
    <Image
      src={MAIN_LOGO}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      style={{ width: 'auto', height, maxWidth: '100%', objectFit: 'contain' }}
    />
  )
}
