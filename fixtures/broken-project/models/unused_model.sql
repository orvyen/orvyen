-- This model is unused (no downstream dependents)
{{ config(materialized='table') }}

SELECT id, name FROM {{ source('raw', 'unused_data') }}
