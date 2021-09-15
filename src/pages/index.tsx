import React, { FunctionComponent, useEffect, useState } from 'react';
import { PageRendererProps } from 'gatsby';
import { BasicLayout } from '@/layouts/';
import Seo from '@/components/seo';
import useTypeWriter from '@/hooks/useTypewriter';
import AnimatedContent from '@/components/AnimatedContent';
import { Box, Flex, Text } from '@chakra-ui/layout';

type Props = PageRendererProps;

const maxims = ['Sow nothing, reap noting', 'Do what you love, Love what you do', 'Man proposes, God disposes'];

const BlogIndex: FunctionComponent<Props> = ({ location }) => {
  const [maxim, setMaxim] = useState(maxims[0]);
  const text = useTypeWriter(maxim);
  useEffect(() => {
    const timer = setInterval(() => {
      setMaxim(maxims[Math.floor(Math.random() * maxims.length)]);
    }, 7000);
    return () => {
      clearInterval(timer);
    };
  }, [maxim]);
  return (
    <BasicLayout location={location}>
      <Seo title="首页" />
      <AnimatedContent>
        <Box h="100vh">
          <Flex
            alignItems="center"
            w="full"
            h="full"
            justifyContent="center"
            backgroundImage="url(/images/blog-home-pic.png)"
            backgroundPosition="center center"
            backgroundSize="cover"
            backgroundRepeat="no-repeat"
          >
            <Box textAlign="center">
              <Text fontSize="3rem" fontWeight="500" py={1} my={3}>
                你好
              </Text>
              <Text as="div" py={1} my={2} h={6}>
                <span>{text || ' '}</span>
              </Text>
            </Box>
          </Flex>
        </Box>
      </AnimatedContent>
    </BasicLayout>
  );
};

export default BlogIndex;
