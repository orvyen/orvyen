-- Simple clean model
{{ config(materialized='table') }}

SELECT
  user_id,
  email,
  created_at
FROM {{ source('raw', 'users') }}
WHERE deleted_at IS NULL
