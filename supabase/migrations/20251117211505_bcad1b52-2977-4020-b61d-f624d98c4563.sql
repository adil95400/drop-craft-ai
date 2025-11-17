-- Enable RLS on integrations table (if not already enabled)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own integrations
CREATE POLICY "Users can view their own integrations"
ON integrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
ON integrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
ON integrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
ON integrations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);