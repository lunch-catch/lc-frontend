import config from '@repo/eslint-config';

export default [
  ...config,
  {
    // components는 다른 components와 api의 타입만 가져온다 (docs/folder-structure.md "의존 방향")
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@admin/api/*'],
              allowTypeImports: true,
              message:
                'components에서는 api의 타입만 import type으로 가져옵니다.',
            },
            {
              group: [
                '@admin/app/*',
                '@admin/auth/*',
                '@admin/features/*',
                '@admin/layout/*',
                '@admin/pages/*',
              ],
              message: 'components에서는 다른 components만 가져옵니다.',
            },
          ],
        },
      ],
    },
  },
];
