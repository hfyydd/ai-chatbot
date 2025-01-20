import os

from openai import OpenAI

from vanna.base import VannaBase

class DeepSeek(VannaBase):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
        
    def system_message(self, message: str) -> any:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> any:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> any:
        return {"role": "assistant", "content": message}

    def generate_sql(self, question: str, **kwargs) -> str:
        # 使用父类的 generate_sql
        sql = super().generate_sql(question, **kwargs)
        
        # 替换 "\_" 为 "_"
        sql = sql.replace("\\_", "_")
        
        return sql

    def submit_prompt(self, prompt, **kwargs) -> str:
        chat_response = self.client.chat.completions.create(
            model="deepseek-chat",
            messages=prompt,
        )
        
        return chat_response.choices[0].message.content