update affiliates
set farmacia_number = '289' || lpad(affiliate_number::integer::text, 8, '0') || '0000'
where farmacia_number is null;
