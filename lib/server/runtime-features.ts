import 'server-only';

import type { RuntimeFeatures } from '@/lib/config/runtime-features';
import { isCloudflareDeployment, isVercelDeployment } from '@/lib/config/deployment';

function getRestrictedFeatures(
  deploymentProvider: RuntimeFeatures['deploymentProvider'],
  deploymentProviderLabel: string
): RuntimeFeatures {
  return {
    deploymentProvider,
    deploymentProviderLabel,
    restrictedManagedDeployment: false,
    mediaProxyEnabled: false,
    iptvEnabled: true,
    restrictionSummary: null,
  };
}

export function getRuntimeFeatures(): RuntimeFeatures {
  if (isCloudflareDeployment()) {
    return getRestrictedFeatures('cloudflare', 'Cloudflare');
  }

  if (isVercelDeployment()) {
    return getRestrictedFeatures('vercel', 'Vercel');
  }

  return {
    deploymentProvider: 'self-hosted',
    deploymentProviderLabel: '自托管',
    restrictedManagedDeployment: false,
    mediaProxyEnabled: true,
    iptvEnabled: true,
    restrictionSummary: null,
  };
}
