import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import TextInput from 'ink-text-input'
import path from 'path'
import fs from 'fs/promises'
import { runAudit } from '../cli/commands/audit'
import { OrvyenConfig } from '../types'

type Screen = 'menu' | 'project-select' | 'options' | 'running' | 'results'

interface MenuItem {
  label: string
  value: string
}

interface AppState {
  screen: Screen
  projectPath: string | null
  format: OrvyenConfig['output']
  includeChecks: Set<string>
  auditResult: any | null
  error: string | null
}

const DEFAULT_CONFIG: OrvyenConfig = {
  include: ['**/*.sql'],
  exclude: [],
  checks: {
    unused_model: true,
    missing_tests: true,
    circular_dependency: true,
    broken_ref: true,
    duplicate_logic: true,
    grain_misalignment: true,
    undocumented_model: true,
    god_model: true,
  },
  output: 'terminal',
  outputDir: '.orvyen',
}

export const OrvyenApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    screen: 'menu',
    projectPath: null,
    format: 'terminal',
    includeChecks: new Set(Object.keys(DEFAULT_CONFIG.checks || {})),
    auditResult: null,
    error: null,
  })

  const handleMainMenu = (val: string) => {
    if (val === 'audit') {
      setState((s: AppState) => ({ ...s, screen: 'project-select' }))
    } else if (val === 'exit') {
      process.exit(0)
    }
  }

  const handleProjectPath = (val: string) => {
    if (val.length > 0) {
      setState((s: AppState) => ({ ...s, projectPath: path.resolve(val), screen: 'options' }))
    }
  }

  const handleFormatSelect = (val: string) => {
    setState((s: AppState) => ({
      ...s,
      format: val as OrvyenConfig['output'],
      screen: 'running',
    }))
  }

  useEffect(() => {
    if (state.screen === 'running' && state.projectPath) {
      runAuditAsync()
    }
  }, [state.screen, state.projectPath])

  const runAuditAsync = async () => {
    try {
      const config: OrvyenConfig = {
        ...DEFAULT_CONFIG,
        output: state.format,
      }

      if (!state.projectPath) throw new Error('No project path')

      const result = await runAudit(config, state.projectPath)
      setState((s: AppState) => ({ ...s, auditResult: result, screen: 'results' }))
    } catch (err: any) {
      setState((s: AppState) => ({ ...s, error: err.message, screen: 'results' }))
    }
  }

  // Main Menu
  if (state.screen === 'menu') {
    const items: MenuItem[] = [
      { label: '🔍 Audit a Project', value: 'audit' },
      { label: '⚙️  Settings', value: 'settings' },
      { label: '📚 Help', value: 'help' },
      { label: '❌ Exit', value: 'exit' },
    ]

    return (
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
        <Text color="cyan" bold>
          ╔═══════════════════════════════════════════════╗
        </Text>
        <Text color="cyan" bold>
          ║       🔍 ORVYEN — SQL Architecture Auditor    ║
        </Text>
        <Text color="cyan" bold>
          ╚═══════════════════════════════════════════════╝
        </Text>
        <Text> </Text>
        <Text>What would you like to do?</Text>
        <Text> </Text>
        <SelectInput items={items} onSelect={(item: MenuItem) => handleMainMenu(item.value)} />
      </Box>
    )
  }

  // Project Path Input
  if (state.screen === 'project-select') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          📁 Enter project path (e.g., ./models or /path/to/sql)
        </Text>
        <Text> </Text>
        <TextInput
          placeholder="./models"
          value={state.projectPath || ''}
          onChange={handleProjectPath}
          onSubmit={() => {
            if (state.projectPath) {
              setState((s) => ({ ...s, screen: 'options' }))
            }
          }}
        />
      </Box>
    )
  }

  // Format Selection
  if (state.screen === 'options') {
    const formatItems: MenuItem[] = [
      { label: '📊 Terminal (colored table)', value: 'terminal' },
      { label: '🌐 HTML (self-contained report)', value: 'html' },
      { label: '📋 JSON (machine-readable)', value: 'json' },
      { label: '⭐ All Formats', value: 'all' },
    ]

    return (
      <Box flexDirection="column" padding={1}>
        <Text color="blue" bold>
          📂 Project: {state.projectPath}
        </Text>
        <Text> </Text>
        <Text color="green" bold>
          Select output format:
        </Text>
        <Text> </Text>
        <SelectInput items={formatItems} onSelect={handleFormatSelect} />
      </Box>
    )
  }

  // Running Audit
  if (state.screen === 'running') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow" bold>
          ⏳ Running audit (this usually takes &lt; 1s)...
        </Text>
        <Text> </Text>
        <Text>📁 {state.projectPath}</Text>
        <Text>📊 Format: {state.format}</Text>
      </Box>
    )
  }

  // Results
  if (state.screen === 'results') {
    if (state.error) {
      return (
        <Box flexDirection="column" padding={1} borderStyle="round" borderColor="red">
          <Text color="red" bold>
            ❌ Error
          </Text>
          <Text>{state.error}</Text>
        </Box>
      )
    }

    if (state.auditResult) {
      const { summary, project } = state.auditResult
      const hasCritical = summary.critical > 0

      return (
        <Box flexDirection="column" padding={1} borderStyle="round" borderColor={hasCritical ? 'red' : 'green'}>
          <Text color={hasCritical ? 'red' : 'green'} bold>
            {hasCritical ? '⚠️  Audit Complete (Issues Found)' : '✅ Audit Complete (All Clean!)'}
          </Text>
          <Text> </Text>
          <Text>📂 Models analyzed: <Text bold>{project.modelsAnalyzed}</Text></Text>
          <Text>📊 Total findings: <Text bold>{summary.total}</Text></Text>
          {summary.critical > 0 && <Text color="red">🔴 Critical: {summary.critical}</Text>}
          {summary.high > 0 && <Text color="yellow">🟠 High: {summary.high}</Text>}
          {summary.medium > 0 && <Text color="cyan">🟡 Medium: {summary.medium}</Text>}
          {summary.low > 0 && <Text color="green">🟢 Low: {summary.low}</Text>}
          <Text> </Text>
          <Text dimColor>📄 Reports saved to: .orvyen/</Text>
          <Text dimColor>💾 Press Ctrl+C to exit</Text>
        </Box>
      )
    }
  }

  return null
}
