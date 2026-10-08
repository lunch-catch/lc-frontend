import config from '@repo/eslint-config';

// 상위 폴더는 상대 경로 대신 앱 경로 별칭으로 가져온다
const parentFolderPattern = {
  group: ['../*'],
  message: '상위 폴더는 @admin/ 별칭으로 가져옵니다.',
};

export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [parentFolderPattern] }],
    },
  },
  {
    // components는 다른 components와 api의 타입만 가져온다 (docs/folder-structure.md "의존 방향").
    // 같은 규칙을 다시 설정하면 위 설정을 덮어쓰므로 상위 폴더 규칙도 함께 둔다
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            parentFolderPattern,
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
