import {
  AmazonGiftCardArt,
  CoinStackArt,
  CrownUltimateArt,
  GiftBoxArt,
} from './RewardArtwork';

/**
 * Maps backend-supplied assetType identifiers ('coin', 'gift-box', 'gift-card', 'crown')
 * to themed VELoop visual components.
 * If official static PNGs from the design assets folder are placed in /public/assets/supplied/,
 * they can be enabled via SUPPLIED_ASSET_PATHS below without altering backend logic.
 */
const SUPPLIED_ASSET_PATHS = {
  // coin: '/assets/supplied/coin.png',
  // 'gift-box': '/assets/supplied/gift-box.png',
  // 'gift-card': '/assets/supplied/gift-card.png',
  // crown: '/assets/supplied/crown.png',
};

export function renderRewardAsset(assetType, size = 54) {
  const customSrc = SUPPLIED_ASSET_PATHS[assetType];
  if (customSrc) {
    return (
      <img
        src={customSrc}
        alt={assetType}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  switch (assetType) {
    case 'gift-box':
      return <GiftBoxArt size={size} />;
    case 'gift-card':
      return <AmazonGiftCardArt size={size} />;
    case 'crown':
      return <CrownUltimateArt size={size} />;
    case 'coin':
    default:
      return <CoinStackArt size={size} />;
  }
}

