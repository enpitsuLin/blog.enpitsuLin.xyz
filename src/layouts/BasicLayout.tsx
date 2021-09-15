import React, { FunctionComponent } from 'react';
import { PageRendererProps } from 'gatsby';
import useSiteMetadata from '@/hooks/useSiteMetadata';

import Header from './components/Header';
import Footer from './components/Footer';
import ToTop from '@/components/Totop';
import { Box, Flex } from '@chakra-ui/layout';

interface Props extends PageRendererProps {}

const BasicLayout: FunctionComponent<Props> = ({ location, children }) => {
  const data = useSiteMetadata();
  const title = data.site?.siteMetadata?.title as string;
  const isHome = location.pathname == '/';

  return (
    <Flex flexDir="column" overflowWrap="break-word">
      <Header title={title} transparent={isHome} />
      <ToTop />
      <Box flex="0 0 100%" minHeight="100vh" pt={isHome ? 0 : 70}>
        {children}
      </Box>
      <Footer />
    </Flex>
  );
};

export default BasicLayout;
