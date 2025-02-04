import { supabase } from '../../supabaseClient';
import { DBCard } from '../../types/card';

const CARD_TABLE = 'cards';

export const getCardDetail = async (id: string): Promise<DBCard | null> => {
  try {
    // First try to get from materialized view
    let { data: cardData, error: cardError } = await supabase
      .from('card_details')
      .select()
      .eq('id', id)
      .single();

    if (cardError) {
      console.error("Error fetching from card_details view", cardError);
      
      // Fallback to direct table query if view fails
      const { data: directData, error: directError } = await supabase
        .from(CARD_TABLE)
        .select()
        .eq('id', id)
        .single();

      if (directError) {
        console.error("Error fetching from cards table", directError);
        return null;
      }

      cardData = directData;
    }

    if (!cardData) {
      console.error("Card not found:", id);
      return null;
    }

    // Get current user's session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        ...cardData,
        isLiked: false,
        isBookmarked: false
      } as DBCard;
    }

    // Check if user has liked the card
    const { data: likeData } = await supabase
      .from('card_likes')
      .select()
      .eq('card_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    // Check if user has bookmarked the card
    const { data: bookmarkData } = await supabase
      .from('card_bookmarks')
      .select()
      .eq('card_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    return {
      ...cardData,
      isLiked: !!likeData,
      isBookmarked: !!bookmarkData
    } as DBCard;
  } catch (error) {
    console.error("Error in getCardDetail:", error);
    return null;
  }
};

export const updateCard = async (id: string, updates: Partial<DBCard>): Promise<DBCard | null> => {
  try {
    // Update the base cards table
    const { error: updateError } = await supabase
      .from(CARD_TABLE)
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error("Error updating card", updateError);
      return null;
    }

    // Refresh materialized view
    await supabase.rpc('refresh_card_details');

    // Fetch updated data
    const { data: updatedCard, error: fetchError } = await supabase
      .from('card_details')
      .select()
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Error fetching updated card", fetchError);
      return null;
    }

    // Get current user's session for like/bookmark status
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        ...updatedCard,
        isLiked: false,
        isBookmarked: false
      } as DBCard;
    }

    // Check if user has liked the card
    const { data: likeData } = await supabase
      .from('card_likes')
      .select()
      .eq('card_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    // Check if user has bookmarked the card
    const { data: bookmarkData } = await supabase
      .from('card_bookmarks')
      .select()
      .eq('card_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    return {
      ...updatedCard,
      isLiked: !!likeData,
      isBookmarked: !!bookmarkData
    } as DBCard;
  } catch (error) {
    console.error("Error in updateCard:", error);
    return null;
  }
};

export const deleteCard = async (id: string): Promise<boolean> => {
  try {
    // Delete likes and bookmarks first
    const { error: likesError } = await supabase
      .from('card_likes')
      .delete()
      .eq('card_id', id);

    if (likesError) {
      console.error("Error deleting card likes", likesError);
      return false;
    }

    const { error: bookmarksError } = await supabase
      .from('card_bookmarks')
      .delete()
      .eq('card_id', id);

    if (bookmarksError) {
      console.error("Error deleting card bookmarks", bookmarksError);
      return false;
    }

    // Delete comments
    const { error: commentsError } = await supabase
      .from('card_comments')
      .delete()
      .eq('card_id', id);

    if (commentsError) {
      console.error("Error deleting card comments", commentsError);
      return false;
    }

    // Finally delete the card
    const { error: cardError } = await supabase
      .from(CARD_TABLE)
      .delete()
      .eq('id', id);

    if (cardError) {
      console.error("Error deleting card", cardError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteCard:", error);
    return false;
  }
};
