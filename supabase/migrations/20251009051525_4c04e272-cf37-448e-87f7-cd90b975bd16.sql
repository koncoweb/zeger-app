-- Add Xendit payment integration columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS xendit_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('outlet', 'rider')),
ADD COLUMN IF NOT EXISTS source_id UUID,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_xendit_invoice ON public.transactions(xendit_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON public.transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON public.transactions(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.external_id IS 'Xendit external reference ID format: ZEG-{source_type}-{source_id}-{timestamp}';
COMMENT ON COLUMN public.transactions.xendit_invoice_id IS 'Xendit invoice ID for payment tracking';
COMMENT ON COLUMN public.transactions.source_type IS 'Transaction source: outlet or rider';
COMMENT ON COLUMN public.transactions.source_id IS 'ID of the outlet or rider profile';
COMMENT ON COLUMN public.transactions.payment_status IS 'Payment status from Xendit webhook';
COMMENT ON COLUMN public.transactions.metadata IS 'Additional payment metadata from Xendit';