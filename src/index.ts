/*
 * @Author: Kabuda-czh
 * @Date: 2023-02-16 11:35:25
 * @LastEditors: Kabuda-czh
 * @LastEditTime: 2023-02-16 17:17:00
 * @FilePath: \koishi-plugin-status-pro\src\index.ts
 * @Description: 
 * 
 * Copyright (c) 2023 by Kabuda-czh, All Rights Reserved.
 */
import { Context, Logger, Schema, segment, version } from 'koishi'
import { getSystemInfo } from './neko/utils';
import {} from "koishi-plugin-puppeteer";
import { Page } from "puppeteer-core";
import { resolve } from 'path';

export const name = 'status-pro'

export interface Config {
  botName?: string
  command?: string
  authority?: number
}

export const Config: Schema<Config> = Schema.object({
  botName: Schema.string().default('koishi').description("机器人名称(默认: koishi)"),
  command: Schema.string().default('自检').description("自检指令自定义(默认: 自检)"),
  authority: Schema.number().default(1).description("自检指令使用权限(默认: 1)"),
})

export const logger = new Logger("status-pro");

export function apply(ctx: Context, config: Config) {
  ctx.command(config.command || "自检", "检查机器人状态", { authority: config.authority || 1 })
    .action(async ({ session }) => {
      const systemInfo = await getSystemInfo(config.botName || "koishi", version, ctx.registry.size);

      let page: Page;
      try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 1920 * 2, height: 1080 * 2 });
        await page.goto(`file:///${resolve(__dirname, "./neko/template.html")}`)
        await page.waitForNetworkIdle();
        await page.evaluate(`action(${JSON.stringify(systemInfo)})`);
        const element = await page.$("#background-page");
        return (
          segment.image(await element.screenshot({
            encoding: "binary"
          }), "image/png")
        );
      } catch (e) {
        logger.error("状态渲染失败: ", e);
        return "渲染失败" + e.message;
      } finally {
        page?.close();
      }
    });
}