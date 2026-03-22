-- Orders model
{{ config(materialized='view') }}

SELECT
  id as order_id,
  user_id,
  amount,
  created_at
FROM {{ source('raw', 'orders') }}
