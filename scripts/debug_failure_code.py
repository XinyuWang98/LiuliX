# Prompt ID: worker-correlation-v1
# Error: {"code":"try:\n    if len(df) == 0:\n        raise ValueError('输入数据为空，无法进行分析')\n    import pandas as pd\n    import matplotlib.pyplot as plt\n    import matplotlib\n    import numpy as np\n    import io\n    import base64\n    import json\n    group_col = 'region'\n    value_col = 'revenue'\n    agg_func = 'sum'\n    if group_col not in df.columns or value_col not in df.columns:\n        raise ValueError(f'列不存在: {group_col} 或 {value_col}')\n    agg_map = {'sum': 'sum', 'mean': 'mean', 'count': 'count', 'median': 'median'}\n    agg_method = agg_map.get(agg_func, 'sum')\n    grouped = df.groupby(group_col)[value_col].agg(agg_method).sort_values(ascending=False)\n    TOP_N = 20\n    if len(grouped) > TOP_N:\n        grouped_display = grouped.head(TOP_N)\n        is_truncated = True\n    else:\n        grouped_display = grouped\n        is_truncated = False\n    fig_height = max(6, min(len(grouped_display) * 0.4, 20))\n    fig, ax = plt.subplots(figsize=(10, fig_height), dpi=72)\n    if len(grouped_display) == 0:\n        raise ValueError('绘图被拦截: 检测到数据为空 (len=0)。请检查过滤条件或数据加载。')\n    grouped_display.plot(kind='barh', ax=ax, color='#3498db')\n    ax.set_xlabel(f'{value_col} ({agg_func})')\n    ax.set_ylabel(group_col)\n    title_suffix = f' (Top {TOP_N})' if is_truncated else ''\n    ax.set_title(f'{group_col} 分组下的 {value_col} {agg_func} 分析{title_suffix}', fontsize=14)\n    ax.invert_yaxis()\n    plt.tight_layout()\n    top_group = grouped.index[0]\n    top_value = grouped.iloc[0]\n    bottom_group = grouped.index[-1]\n    bottom_value = grouped.iloc[-1]\n    truncate_note = f'（共 {len(grouped)} 个分组，仅展示 Top {TOP_N}）' if is_truncated else ''\n    summary = f'{group_col} 共 {len(grouped)} 个分组，{value_col} 的 {agg_func} 最高为 {top_group} ({top_value:.2f})，最低为 {bottom_group} ({bottom_value:.2f}){truncate_note}'\n    buf = io.BytesIO()\n    fig.savefig(buf, format='png', bbox_inches='tight')\n    buf.seek(0)\n    image_base64 = base64.b64encode(buf.read()).decode('utf-8')\n    plt.close(fig)\n    result = {'image': image_base64, 'summary': summary, 'columnsUsed': [group_col, value_col]}\n    print(json.dumps(result), flush=True)\nexcept IndexError as e:\n    raise ValueError(f'数据索引越界（可能是过滤后结果为空）: {str(e)}')\nexcept KeyError as e:\n    raise ValueError(f'列不存在: {str(e)}')\nexcept ZeroDivisionError:\n    raise ValueError('除零错误（可能是分组后某组数据为空）')"}

try:
    if len(df) == 0:
        raise ValueError('输入数据为空，无法进行分析')
    import pandas as pd
    import matplotlib.pyplot as plt
    import matplotlib
    import numpy as np
    import io
    import base64
    import json
    group_col = 'region'
    value_col = 'revenue'
    agg_func = 'sum'
    if group_col not in df.columns or value_col not in df.columns:
        raise ValueError(f'列不存在: {group_col} 或 {value_col}')
    agg_map = {'sum': 'sum', 'mean': 'mean', 'count': 'count', 'median': 'median'}
    agg_method = agg_map.get(agg_func, 'sum')
    grouped = df.groupby(group_col)[value_col].agg(agg_method).sort_values(ascending=False)
    TOP_N = 20
    if len(grouped) > TOP_N:
        grouped_display = grouped.head(TOP_N)
        is_truncated = True
    else:
        grouped_display = grouped
        is_truncated = False
    fig_height = max(6, min(len(grouped_display) * 0.4, 20))
    fig, ax = plt.subplots(figsize=(10, fig_height), dpi=72)
    if len(grouped_display) == 0:
        raise ValueError('绘图被拦截: 检测到数据为空 (len=0)。请检查过滤条件或数据加载。')
    grouped_display.plot(kind='barh', ax=ax, color='#3498db')
    ax.set_xlabel(f'{value_col} ({agg_func})')
    ax.set_ylabel(group_col)
    title_suffix = f' (Top {TOP_N})' if is_truncated else ''
    ax.set_title(f'{group_col} 分组下的 {value_col} {agg_func} 分析{title_suffix}', fontsize=14)
    ax.invert_yaxis()
    plt.tight_layout()
    top_group = grouped.index[0]
    top_value = grouped.iloc[0]
    bottom_group = grouped.index[-1]
    bottom_value = grouped.iloc[-1]
    truncate_note = f'（共 {len(grouped)} 个分组，仅展示 Top {TOP_N}）' if is_truncated else ''
    summary = f'{group_col} 共 {len(grouped)} 个分组，{value_col} 的 {agg_func} 最高为 {top_group} ({top_value:.2f})，最低为 {bottom_group} ({bottom_value:.2f}){truncate_note}'
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    result = {'image': image_base64, 'summary': summary, 'columnsUsed': [group_col, value_col]}
    print(json.dumps(result), flush=True)
except IndexError as e:
    raise ValueError(f'数据索引越界（可能是过滤后结果为空）: {str(e)}')
except KeyError as e:
    raise ValueError(f'列不存在: {str(e)}')
except ZeroDivisionError:
    raise ValueError('除零错误（可能是分组后某组数据为空）')