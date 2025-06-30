/*
 * Category Manager HomePage
 */

import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Flex
} from '@strapi/design-system';
import {
  Plus,
  Search,
  Cog,
  More
} from '@strapi/icons';
import pluginId from '../../pluginId';


type QuickStartStepProps = {
  number: number;
  color: 'primary' | 'success' | 'warning' | 'secondary';
  title: string;
  description: string;
};

const HomePage = () => {
  const statsData = [
    {
      icon: Plus,
      title: "Active Categories",
      description: "Manage your content taxonomy",
      bgColor: "primary100",
      iconColor: "#4945ff"
    },
    {
      icon: Search,
      title: "Smart Filtering",
      description: "Cascading dropdown logic",
      bgColor: "success100",
      iconColor: "#00b894"
    },
    {
      icon: Cog,
      title: "Data Integration",
      description: "Seamless content linking",
      bgColor: "warning100",
      iconColor: "#f59e0b"
    },
    {
      icon: More,
      title: "Custom Fields",
      description: "Extended functionality",
      bgColor: "secondary100",
      iconColor: "#8b5cf6"
    }
  ];

  const features = [
    {
      icon: Plus,
      title: "Hierarchical Categories",
      description: "Create nested category structures with unlimited depth for complex content organization.",
      badge: "Core Feature"
    },
    {
      icon: Search,
      title: "Cascading Dropdowns",
      description: "Interactive category selection with parent-child relationships and smart filtering.",
      badge: "UI Enhancement"
    },
    {
      icon: Cog,
      title: "Taxonomy Management",
      description: "Manage category relationships, metadata, and classification systems efficiently.",
      badge: "Data Management"
    },
    {
      icon: More,
      title: "Custom Field Integration",
      description: "Seamlessly integrate category selectors into your content types and custom fields.",
      badge: "Integration"
    }
  ];

  const QuickStartStep: React.FC<QuickStartStepProps> = ({ number, color, title, description }) => (
    <Flex style={{ alignItems: 'flex-start', gap: '1rem' }}>
      <Flex
        background={`${color}100`}
        padding={2}
        borderRadius="50%"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: '2rem',
          height: '2rem',
          flexShrink: 0,
        }}
      >
        <Typography variant="pi" fontWeight="bold" textColor={`${color}600`}>
          {number}
        </Typography>
      </Flex>
      <Box>
        <Typography
          variant="omega"
          fontWeight="bold"
          textColor="neutral800"
          marginBottom={1}
          marginRight={2}
        >
          {title}
        </Typography>
        <Typography variant="omega" textColor="neutral600">
          {description}
        </Typography>
      </Box>
    </Flex>
  );

  const quickStartSteps: QuickStartStepProps[] = [
    {
      number: 1,
      color: 'primary',
      title: 'Set up categories',
      description:
        'Navigate to Content Types and add the Category Selector field to your content types',
    },
    {
      number: 2,
      color: 'success',
      title: 'Create hierarchy',
      description: 'Define parent-child relationships for nested category structures',
    },
    {
      number: 3,
      color: 'warning',
      title: 'Configure filtering',
      description: 'Set up cascading dropdown behavior for enhanced user experience',
    },
    {
      number: 4,
      color: 'secondary',
      title: 'Start organizing',
      description:
        'Use the category selectors in your content entries to organize and classify content',
    },
  ];


  return (
    <Box padding={8} background="neutral0">
      {/* Header Section */}
      <Box marginBottom={8}>
        <Box marginBottom={4}>
          <Typography variant="alpha" textColor="neutral800" marginBottom={3}>
            Category Manager
          </Typography>
        </Box>
        <Box >
          <Typography variant="epsilon" textColor="neutral600" maxWidth="600px">
            Advanced category management system with hierarchical organization and smart filtering
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box marginBottom={10}>
        <Box marginBottom={4}>
          <Typography variant="beta" textColor="neutral800" marginBottom={6}>
            Overview
          </Typography>
        </Box>
        <Box style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {statsData.map((stat, index) => (
            <Card key={index} style={{ height: '100%' }}>
              <CardBody style={{
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'center',
              }}>
                <Flex
                  style={{
                    flexDirection: 'column',
                    padding: '1rem 0'
                  }}>
                  <Flex
                    background={stat.bgColor}
                    padding={4}
                    borderRadius="50%"
                    marginBottom={4}
                  >
                    <stat.icon color={stat.iconColor} width="2rem" height="2rem" />
                  </Flex>
                  <Typography variant="delta" fontWeight="bold" textColor="neutral800" marginBottom={2}>
                    {stat.title}
                  </Typography>
                  <Typography variant="omega" textColor="neutral600">
                    {stat.description}
                  </Typography>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Features Section */}
      <Box marginBottom={8}>
        <Box marginBottom={3}>
          <Typography variant="beta" textColor="neutral800" marginBottom={6}>
            Key Features
          </Typography>
        </Box>

        <Grid.Root gap={6} >
          {features.map((feature, index) => (
            <Grid.Item key={index} col={6}>
              <Card style={{ height: '100%', width: '100%' }}>
                <CardHeader>
                  <Flex justifyContent="space-between" alignItems="flex-start" width="100%">
                    <Flex alignItems="center" gap={4} flex={1}>
                      <Flex
                        background="neutral100"
                        padding={3}
                        borderRadius="8px"
                        justifyContent="center"
                        alignItems="center"
                        flexShrink={0}
                      >
                        <feature.icon color="#6b7280" width="1.5rem" height="1.5rem" />
                      </Flex>
                      <Typography variant="delta" fontWeight="bold" textColor="neutral800">
                        {feature.title}
                      </Typography>
                    </Flex>
                    <Badge size="S" style={{ marginLeft: '1rem' }}>
                      {feature.badge}
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Typography variant="omega" textColor="neutral600" lineHeight="1.6">
                    {feature.description}
                  </Typography>
                </CardBody>
              </Card>
            </Grid.Item>
          ))}
        </Grid.Root>
      </Box>

      {/* Quick Start Section */}
      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <CardHeader style={{ marginBottom: '1rem' }}>
          <Typography variant="beta" fontWeight="bold" textColor="neutral800" marginBottom={2}>
            Quick Start Guide
          </Typography>
        </CardHeader>
        <CardBody style={{ flexDirection: 'column', marginLeft: '2rem', marginRight: '2rem' }}>
          <Typography variant="delta" textColor="neutral700" marginBottom={4}>
            Get started with the Category Manager plugin:
          </Typography>
          <Box style={{ display: 'grid', gap: '1rem' }}>
            {quickStartSteps.map((step) => (
              <QuickStartStep key={step.number} {...step} />
            ))}
          </Box>
        </CardBody>
      </Card>

      {/* Footer Info */}
      <Box paddingTop={4} borderColor="neutral200" borderWidth="1px 0 0 0">
        <Flex style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <Typography variant="pi" textColor="neutral500">
            Plugin ID: {pluginId}
          </Typography>
          <Typography variant="pi" textColor="neutral500">
            Version 1.0.0 | Compatible with Strapi v5
          </Typography>
        </Flex>
      </Box>
    </Box >
  );
};

export default HomePage;