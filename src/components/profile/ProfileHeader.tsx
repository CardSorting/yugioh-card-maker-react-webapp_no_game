import { Profile, ProfileStats } from '../../types/profile';

interface ProfileHeaderProps {
  profile: Profile;
  stats: ProfileStats;
  onEditProfile?: (updates: Partial<Profile>) => Promise<Profile | null>;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
  isOwnProfile: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  stats,
  onFollow,
  onUnfollow,
}) => {
  const renderActionButton = () => {

    if (!onFollow || !onUnfollow) return null;

    return stats.isFollowing ? (
      <button
        onClick={onUnfollow}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
      >
        Following
      </button>
    ) : (
      <button
        onClick={onFollow}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
      >
        Follow
      </button>
    );
  };

  return (
    <div className="py-8">
      <div className="flex items-center gap-8">
        {/* Profile Image */}
        <img 
          src={profile.profile_image_path || '/static/images/default.jpg'} 
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover"
        />

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">{profile.username}</h1>
            {renderActionButton()}
          </div>

          <div className="flex space-x-8">
            <div>
              <span className="font-semibold">{stats.cardsCount}</span>
              <span className="text-gray-500 ml-1">cards</span>
            </div>
            <div>
              <span className="font-semibold">{stats.followersCount}</span>
              <span className="text-gray-500 ml-1">followers</span>
            </div>
            <div>
              <span className="font-semibold">{stats.followingCount}</span>
              <span className="text-gray-500 ml-1">following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mt-4">
          <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

    </div>
  );
};
