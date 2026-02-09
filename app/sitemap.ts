import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wisemotors.ai'

  let vehicleUrls: MetadataRoute.Sitemap = []
  try {
    // Fetch all vehicles to create dynamic routes (may fail during build if DB unreachable)
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
    })
    vehicleUrls = vehicles.map((vehicle) => ({
      url: `${baseUrl}/vehicles/${vehicle.id}`,
      lastModified: vehicle.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // DB unreachable (e.g. during build) - use static URLs only
  }

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Error().stack?.includes('sitemap.ts') ? new Date() : new Date(), // Just a placeholder for "now"
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/vehicles`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  return [...staticUrls, ...vehicleUrls]
}
