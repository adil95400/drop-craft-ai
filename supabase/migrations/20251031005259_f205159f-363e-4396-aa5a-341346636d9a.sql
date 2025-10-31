-- Enable RLS on premium_suppliers table
ALTER TABLE premium_suppliers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read active suppliers
CREATE POLICY "Anyone can view active suppliers"
ON premium_suppliers
FOR SELECT
USING (is_active = true);

-- Policy: Only admins can view all suppliers (including inactive)
CREATE POLICY "Admins can view all suppliers"
ON premium_suppliers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can insert suppliers
CREATE POLICY "Admins can insert suppliers"
ON premium_suppliers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update suppliers
CREATE POLICY "Admins can update suppliers"
ON premium_suppliers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete suppliers
CREATE POLICY "Admins can delete suppliers"
ON premium_suppliers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));