import { initInteractionManifest } from '@renderx-plugins/host-sdk/core/manifests/interactionManifest';
import { initTopicsManifest } from '@renderx-plugins/host-sdk/core/manifests/topicsManifest';
import { getPluginManifestStats } from '@renderx-plugins/host-sdk/core/startup/startupValidation';

console.log('smoke:', initInteractionManifest, initTopicsManifest, getPluginManifestStats);

