import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { resolve } from 'path';
import { LlmConfig, ProviderConfig, ModelConfig } from './interfaces/llm-provider.interface';

/**
 * 默认配置
 * 当配置文件加载失败时使用
 */
const DEFAULT_CONFIG: LlmConfig = {
  providers: [
    {
      name: 'moonshot',
      displayName: '月之暗面',
      baseUrl: 'https://api.moonshot.cn/v1',
      apiKey: process.env.MOONSHOT_API_KEY || '',
      priority: 1,
      enabled: !!process.env.MOONSHOT_API_KEY,
      models: [
        {
          id: 'moonshot-v1-8k',
          name: 'Kimi 8K',
          maxTokens: 8192,
          contextWindow: 8192,
          inputPrice: 0.000012,
          outputPrice: 0.000012,
          default: false,
          enabled: true,
        },
        {
          id: 'moonshot-v1-32k',
          name: 'Kimi 32K',
          maxTokens: 32000,
          contextWindow: 32000,
          inputPrice: 0.000024,
          outputPrice: 0.000024,
          default: true,
          enabled: true,
        },
        {
          id: 'moonshot-v1-128k',
          name: 'Kimi 128K',
          maxTokens: 128000,
          contextWindow: 128000,
          inputPrice: 0.00006,
          outputPrice: 0.00006,
          default: false,
          enabled: true,
        },
      ],
    },
  ],
  defaults: {
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 4096,
    presencePenalty: 0,
    frequencyPenalty: 0,
  },
  streaming: {
    enabled: true,
    chunkSize: 16,
    maxConcurrent: 100,
  },
  costControl: {
    enabled: true,
    maxMonthlyBudget: 100,
    alertThreshold: 0.8,
  },
};

/**
 * LLM 配置服务
 * 从 YAML 文件加载配置，支持环境变量替换
 */
@Injectable()
export class LlmConfigService implements OnModuleInit {
  private readonly logger = new Logger(LlmConfigService.name);
  private config: LlmConfig = DEFAULT_CONFIG; // 使用默认配置初始化

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    this.loadConfig();
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): void {
    try {
      // 尝试多个可能的路径
      const possiblePaths = [
        resolve(process.cwd(), 'config/llm.yaml'),
        resolve(process.cwd(), '../config/llm.yaml'),
        resolve(__dirname, '../../config/llm.yaml'),
      ];

      let configPath: string | null = null;
      for (const path of possiblePaths) {
        if (existsSync(path)) {
          configPath = path;
          break;
        }
      }

      if (!configPath) {
        this.logger.warn('LLM config file not found, using default config');
        return;
      }

      const fileContent = readFileSync(configPath, 'utf-8');
      
      // 替换环境变量
      const interpolatedContent = this.interpolateEnvVars(fileContent);
      
      this.config = parse(interpolatedContent) as LlmConfig;
      
      this.logger.log(`Loaded ${this.config.providers.length} LLM providers`);
      
      // 验证配置
      this.validateConfig();
    } catch (error) {
      this.logger.error('Failed to load LLM config, using default config', error);
      // 使用默认配置继续运行
    }
  }

  /**
   * 替换环境变量
   * 格式: ${VAR_NAME} 或 ${VAR_NAME:-default}
   */
  private interpolateEnvVars(content: string): string {
    return content.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const [name, defaultValue] = varName.split(':-');
      const value = process.env[name.trim()];
      
      if (value !== undefined) {
        return value;
      }
      
      if (defaultValue !== undefined) {
        return defaultValue.trim();
      }
      
      this.logger.warn(`Environment variable ${name} not found`);
      return match;
    });
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    const enabledProviders = this.config.providers.filter((p) => p.enabled);
    
    if (enabledProviders.length === 0) {
      this.logger.warn('No LLM providers enabled');
    }

    for (const provider of enabledProviders) {
      if (!provider.apiKey || provider.apiKey.length < 10) {
        this.logger.warn(`Provider ${provider.name} has no valid API key configured`);
      }

      const enabledModels = provider.models.filter((m) => m.enabled);
      if (enabledModels.length === 0) {
        this.logger.warn(`Provider ${provider.name} has no enabled models`);
      }
    }
  }

  /**
   * 获取完整配置
   */
  getConfig(): LlmConfig {
    return this.config;
  }

  /**
   * 获取所有提供商配置
   */
  getProviders(): ProviderConfig[] {
    return this.config.providers;
  }

  /**
   * 获取启用的提供商
   */
  getEnabledProviders(): ProviderConfig[] {
    return this.config.providers
      .filter((p) => p.enabled && p.apiKey && p.apiKey.length > 10)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * 获取指定提供商
   */
  getProvider(name: string): ProviderConfig | undefined {
    return this.config.providers.find((p) => p.name === name);
  }

  /**
   * 获取所有可用模型
   */
  getAllModels(): Array<{ provider: string; model: ModelConfig }> {
    const models: Array<{ provider: string; model: ModelConfig }> = [];
    
    for (const provider of this.getEnabledProviders()) {
      for (const model of provider.models.filter((m) => m.enabled)) {
        models.push({ provider: provider.name, model });
      }
    }
    
    return models;
  }

  /**
   * 获取默认模型
   */
  getDefaultModel(): { provider: string; model: ModelConfig } | null {
    // 1. 查找标记为 default 的模型
    for (const provider of this.getEnabledProviders()) {
      const defaultModel = provider.models.find((m) => m.enabled && m.default);
      if (defaultModel) {
        return { provider: provider.name, model: defaultModel };
      }
    }

    // 2. 返回第一个可用模型
    const firstProvider = this.getEnabledProviders()[0];
    if (firstProvider) {
      const firstModel = firstProvider.models.find((m) => m.enabled);
      if (firstModel) {
        return { provider: firstProvider.name, model: firstModel };
      }
    }

    return null;
  }

  /**
   * 获取模型配置
   */
  getModelConfig(modelId: string): { provider: string; model: ModelConfig } | null {
    for (const provider of this.getEnabledProviders()) {
      const model = provider.models.find((m) => m.id === modelId && m.enabled);
      if (model) {
        return { provider: provider.name, model };
      }
    }
    return null;
  }

  /**
   * 获取全局默认参数
   */
  getDefaultParams() {
    return this.config.defaults;
  }

  /**
   * 获取流式配置
   */
  getStreamingConfig() {
    return this.config.streaming;
  }

  /**
   * 获取成本控制配置
   */
  getCostControlConfig() {
    return this.config.costControl;
  }
}
