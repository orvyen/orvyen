-- Model with tests
{{ config(materialized='table') }}

SELECT
  user_id,
  COUNT(*) as order_count,
  SUM(amount) as total_spent
FROM {{ ref('orders') }}
GROUP BY user_id
