import { Metadata } from 'next';
import { projectsApi } from '@/services/api';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const projectData = await projectsApi.getProject(Number(params.id) || params.id);
    
    // Get the first description
    const firstDescription = projectData.descriptions && projectData.descriptions.length > 0 
      ? projectData.descriptions[0].content 
      : projectData.description || '';

    // Get thumbnail image - prioritize thumbnails, then cover_image, then first image
    let thumbnailImage = '';
    if (projectData.thumbnails && projectData.thumbnails.length > 0) {
      thumbnailImage = projectData.thumbnails[0].image_url;
    } else if (projectData.cover_image) {
      thumbnailImage = projectData.cover_image;
    } else if (projectData.images && projectData.images.length > 0) {
      thumbnailImage = projectData.images[0];
    }

    // Clean description for OG (remove HTML tags and limit length)
    const cleanDescription = firstDescription
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 160); // Limit to 160 characters

    return {
      title: projectData.name || `Project ${params.id}`,
      description: cleanDescription,
      openGraph: {
        title: projectData.name || `Project ${params.id}`,
        description: cleanDescription,
        images: thumbnailImage ? [
          {
            url: thumbnailImage,
            width: 1200,
            height: 630,
            alt: projectData.name || `Project ${params.id}`,
          }
        ] : [],
        type: 'website',
        locale: 'vi_VN',
        siteName: 'Moc Productions',
      },
      twitter: {
        card: 'summary_large_image',
        title: projectData.name || `Project ${params.id}`,
        description: cleanDescription,
        images: thumbnailImage ? [thumbnailImage] : [],
      },
    };
  } catch (error) {
    // Fallback metadata if API call fails
    return {
      title: `Project ${params.id}`,
      description: 'Project details from Moc Productions',
      openGraph: {
        title: `Project ${params.id}`,
        description: 'Project details from Moc Productions',
        type: 'website',
        locale: 'vi_VN',
        siteName: 'Moc Productions',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Project ${params.id}`,
        description: 'Project details from Moc Productions',
      },
    };
  }
} 