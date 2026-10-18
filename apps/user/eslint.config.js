import config from '@repo/eslint-config';

export default [
  ...config,
  {
    // ui는 다른 ui와 api의 타입만 가져온다 (docs/folder-structure.md "의존 방향")
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@user/api/*'],
              allowTypeImports: true,
              message: 'ui에서는 api의 타입만 import type으로 가져옵니다.',
            },
            {
              group: [
                '@user/app/*',
                '@user/auth/*',
                '@user/features/*',
                '@user/layout/*',
                '@user/pages/*',
              ],
              message: 'ui에서는 다른 ui만 가져옵니다.',
            },
          ],
        },
      ],
    },
  },
];
