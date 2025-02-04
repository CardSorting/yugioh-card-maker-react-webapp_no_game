-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;

-- Create new policies
CREATE POLICY "Users can view their own and deck cards"
    ON cards
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM deck_cards dc
            JOIN decks d ON d.id = dc.deck_id
            WHERE dc.card_id = cards.id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own cards"
    ON cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
    ON cards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
    ON cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index to improve performance of the new policy
CREATE INDEX IF NOT EXISTS deck_cards_card_id_deck_id_idx ON deck_cards(card_id, deck_id);
