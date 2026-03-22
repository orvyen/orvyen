-- Complex model with many joins (god model)
{{ config(materialized='table') }}

SELECT
  o.order_id,
  u.user_id,
  u.email,
  p.product_id,
  p.product_name,
  c.category_name,
  v.vendor_name,
  s.store_id,
  s.store_name,
  r.region_name,
  CASE
    WHEN o.status = 'completed' THEN 'Completed'
    WHEN o.status = 'pending' THEN 'Pending'
    WHEN o.status = 'cancelled' THEN 'Cancelled'
    ELSE 'Unknown'
  END as order_status,
  CASE
    WHEN o.amount > 1000 THEN 'High Value'
    WHEN o.amount > 500 THEN 'Medium Value'
    ELSE 'Low Value'
  END as order_value_tier
FROM {{ ref('orders') }} o
LEFT JOIN {{ ref('users') }} u ON o.user_id = u.user_id
LEFT JOIN {{ ref('products') }} p ON o.product_id = p.product_id
LEFT JOIN {{ ref('categories') }} c ON p.category_id = c.category_id
LEFT JOIN {{ ref('vendors') }} v ON p.vendor_id = v.vendor_id
LEFT JOIN {{ ref('stores') }} s ON o.store_id = s.store_id
LEFT JOIN {{ ref('regions') }} r ON s.region_id = r.region_id
