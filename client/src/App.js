import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MantineProvider, AppShell, Navbar, Header, Button, TextInput, Textarea, Grid, Card, Text } from '@mantine/core';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LatexAnnotationInterface = () => {
  const [problems, setProblems] = useState({});
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [editableProblem, setEditableProblem] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (currentProblemId && problems[currentProblemId]) {
      setEditableProblem(problems[currentProblemId].editable_problem);
    }
  }, [currentProblemId, problems]);

  const fetchProblems = async () => {
    try {
      const response = await axios.get(`${API_URL}/problems`);
      setProblems(response.data);
      if (response.data && Object.keys(response.data).length > 0) {
        setCurrentProblemId(Object.keys(response.data)[0]);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProblems();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSave = async (moveToNext = false) => {
    if (currentProblemId) {
      try {
        await axios.put(`${API_URL}/problems/${currentProblemId}`, {
          editable_problem: editableProblem,
        });
        fetchProblems();
        if (moveToNext) {
          navigateProblems('next');
        }
      } catch (error) {
        console.error('Error saving problem:', error);
      }
    }
  };

  const navigateProblems = (direction) => {
    const problemIds = Object.keys(problems);
    const currentIndex = problemIds.indexOf(currentProblemId);
    if (direction === 'next' && currentIndex < problemIds.length - 1) {
      setCurrentProblemId(problemIds[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentProblemId(problemIds[currentIndex - 1]);
    }
  };

  const renderLatex = (latex) => {
    try {
      return { __html: katex.renderToString(latex, { throwOnError: false }) };
    } catch (error) {
      console.error('Error rendering LaTeX:', error);
      return { __html: latex };
    }
  };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell
        padding="md"
        navbar={
          <Navbar width={{ base: 300 }} p="xs">
            {Object.entries(problems).map(([id, problem]) => (
              <Button
                key={id}
                fullWidth
                variant={problem.annotation_status !== 'unannotated' ? 'filled' : 'light'}
                onClick={() => setCurrentProblemId(id)}
                mb="sm"
              >
                {id}
              </Button>
            ))}
          </Navbar>
        }
        header={
          <Header height={60} p="xs">
            <Grid>
              <Grid.Col span={8}>
                <Text size="xl" weight={700}>LaTeX Annotation Interface</Text>
              </Grid.Col>
              <Grid.Col span={4} style={{ textAlign: 'right' }}>
                <Button component="label">
                  Upload Data
                  <input type="file" hidden onChange={handleFileUpload} accept=".json" />
                </Button>
              </Grid.Col>
            </Grid>
          </Header>
        }
      >
        {currentProblemId && problems[currentProblemId] && (
          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" p="lg">
                <Card.Section>
                  <Text weight={500} size="lg" mb="sm">Original Problem</Text>
                </Card.Section>
                <Text mb="sm">{problems[currentProblemId].original_problem}</Text>
                <div dangerouslySetInnerHTML={renderLatex(problems[currentProblemId].original_problem)} />
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card shadow="sm" p="lg">
                <Card.Section>
                  <Text weight={500} size="lg" mb="sm">Editable Problem</Text>
                </Card.Section>
                <Textarea
                  value={editableProblem}
                  onChange={(event) => setEditableProblem(event.currentTarget.value)}
                  minRows={4}
                  mb="sm"
                />
                <div dangerouslySetInnerHTML={renderLatex(editableProblem)} />
              </Card>
            </Grid.Col>
          </Grid>
        )}
        <Grid mt="md">
          <Grid.Col span={3}>
            <Button fullWidth onClick={() => navigateProblems('prev')}>Previous</Button>
          </Grid.Col>
          <Grid.Col span={3}>
            <Button fullWidth onClick={() => handleSave()}>Save</Button>
          </Grid.Col>
          <Grid.Col span={3}>
            <Button fullWidth onClick={() => handleSave(true)}>Save and Next</Button>
          </Grid.Col>
          <Grid.Col span={3}>
            <Button fullWidth onClick={() => navigateProblems('next')}>Next</Button>
          </Grid.Col>
        </Grid>
      </AppShell>
    </MantineProvider>
  );
};

export default LatexAnnotationInterface;